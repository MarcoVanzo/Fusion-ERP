<?php
/**
 * FinanceServiceTest — Unit tests for sport tax calculation and entry validation
 * Fusion ERP v1.1
 *
 * Tests the pure business logic in FinanceService that doesn't require a database:
 *  - calculateSportTaxes() — Italian sport worker tax calculations (Riforma dello Sport)
 *  - createEntry() — validation rules (description, date, balance check)
 */

declare(strict_types=1);

namespace FusionERP\Tests\Unit;

use PHPUnit\Framework\TestCase;

class FinanceServiceTest extends TestCase
{
    private object $service;

    protected function setUp(): void
    {
        // Create a FinanceService with a mock repository to isolate business logic
        // disableOriginalConstructor avoids the DB connection in the real constructor
        $mockRepo = $this->getMockBuilder(\FusionERP\Modules\Finance\FinanceRepository::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->service = new \FusionERP\Modules\Finance\FinanceService($mockRepo);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // calculateSportTaxes — Riforma dello Sport
    // ═══════════════════════════════════════════════════════════════════════════

    public function testTaxesBelowInpsThreshold(): void
    {
        // Worker earns €3000 total → below €5000 INPS exemption
        $result = $this->service->calculateSportTaxes(3000.0, 0.0);

        $this->assertEquals(3000.0, $result['amount']);
        $this->assertEquals(3000.0, $result['total_income']);
        $this->assertEquals(0.0, $result['taxable_inps'], 'Should be INPS-exempt below €5000');
        $this->assertEquals(0.0, $result['inps_contribution']);
        $this->assertEquals(0.0, $result['taxable_irpef'], 'Should be IRPEF-exempt below €15000');
        $this->assertEquals(0.0, $result['irpef_contribution']);
        $this->assertEquals(3000.0, $result['net_amount'], 'Net should equal gross when fully exempt');
    }

    public function testTaxesCrossingInpsThreshold(): void
    {
        // Worker already earned €4000, new payment €2000 → total €6000
        // Only €1000 is INPS-taxable (the portion above €5000)
        $result = $this->service->calculateSportTaxes(2000.0, 4000.0);

        $this->assertEquals(6000.0, $result['total_income']);
        $this->assertEquals(1000.0, $result['taxable_inps']);
        $this->assertEquals(0.0, $result['taxable_irpef'], 'Below €15000 IRPEF threshold');
    }

    public function testTaxesAboveInpsThreshold(): void
    {
        // Worker already above €5000, entire new amount is INPS-taxable
        $result = $this->service->calculateSportTaxes(1000.0, 6000.0);

        $this->assertEquals(7000.0, $result['total_income']);
        $this->assertEquals(1000.0, $result['taxable_inps'], 'Entire amount should be INPS-taxable');
    }

    public function testTaxesCrossingIrpefThreshold(): void
    {
        // Worker already earned €14000, new payment €3000 → total €17000
        // €2000 is IRPEF-taxable (portion above €15000)
        $result = $this->service->calculateSportTaxes(3000.0, 14000.0);

        $this->assertEquals(17000.0, $result['total_income']);
        $this->assertEquals(3000.0, $result['taxable_inps'], 'Entire amount above INPS threshold');
        $this->assertEquals(2000.0, $result['taxable_irpef'], 'Only portion above €15000');
    }

    public function testTaxesFullyAboveAllThresholds(): void
    {
        // Worker already above both thresholds
        $result = $this->service->calculateSportTaxes(5000.0, 20000.0);

        $this->assertEquals(25000.0, $result['total_income']);
        $this->assertEquals(5000.0, $result['taxable_inps'], 'Full amount is INPS-taxable');
        $this->assertEquals(5000.0, $result['taxable_irpef'], 'Full amount is IRPEF-taxable');
    }

    public function testTaxesInpsCalculation(): void
    {
        // Verify INPS formula: taxable * 50% * 25% rate
        $result = $this->service->calculateSportTaxes(5000.0, 20000.0);

        $expectedInpsBase = 5000.0 * 0.5; // 50% of taxable
        $expectedInps = $expectedInpsBase * 0.25; // 25% rate
        $expectedWorkerShare = $expectedInps / 3; // Worker pays 1/3

        $this->assertEquals($expectedInps, $result['inps_contribution']);
        $this->assertEquals($expectedWorkerShare, $result['inps_worker_share']);
    }

    public function testTaxesIrpefCalculation(): void
    {
        // Verify IRPEF formula: taxable * 23%
        $result = $this->service->calculateSportTaxes(5000.0, 20000.0);

        $expectedIrpef = 5000.0 * 0.23;
        $this->assertEquals($expectedIrpef, $result['irpef_contribution']);
    }

    public function testTaxesNetAmountCalculation(): void
    {
        // Net = amount - worker_inps_share - irpef
        $result = $this->service->calculateSportTaxes(5000.0, 20000.0);

        $expectedNet = 5000.0 - $result['inps_worker_share'] - $result['irpef_contribution'];
        $this->assertEqualsWithDelta($expectedNet, $result['net_amount'], 0.01);
    }

    public function testTaxesZeroAmount(): void
    {
        $result = $this->service->calculateSportTaxes(0.0, 0.0);

        $this->assertEquals(0.0, $result['amount']);
        $this->assertEquals(0.0, $result['net_amount']);
        $this->assertEquals(0.0, $result['inps_contribution']);
        $this->assertEquals(0.0, $result['irpef_contribution']);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // createEntry — Validation Rules
    // ═══════════════════════════════════════════════════════════════════════════

    public function testCreateEntryMissingDescription(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Descrizione obbligatoria');

        $this->service->createEntry([
            'description' => '',
            'entry_date' => '2026-01-15',
            'lines' => [
                ['account_id' => 'A1', 'debit' => 100, 'credit' => 0],
                ['account_id' => 'A2', 'debit' => 0, 'credit' => 100],
            ]
        ], 'user_123');
    }

    public function testCreateEntryMissingDate(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Data obbligatoria');

        $this->service->createEntry([
            'description' => 'Test entry',
            'entry_date' => '',
            'lines' => [
                ['account_id' => 'A1', 'debit' => 100, 'credit' => 0],
                ['account_id' => 'A2', 'debit' => 0, 'credit' => 100],
            ]
        ], 'user_123');
    }

    public function testCreateEntryTooFewLines(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('min. 2 righe');

        $this->service->createEntry([
            'description' => 'Test entry',
            'entry_date' => '2026-01-15',
            'lines' => [
                ['account_id' => 'A1', 'debit' => 100, 'credit' => 0],
            ]
        ], 'user_123');
    }

    public function testCreateEntryUnbalancedDebitCredit(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('non quadra');

        $this->service->createEntry([
            'description' => 'Test entry',
            'entry_date' => '2026-01-15',
            'lines' => [
                ['account_id' => 'A1', 'debit' => 100, 'credit' => 0],
                ['account_id' => 'A2', 'debit' => 0, 'credit' => 50],  // Unbalanced!
            ]
        ], 'user_123');
    }

    public function testCreateEntryBalancedCallsRepository(): void
    {
        // A balanced entry should pass validation and reach the repository
        $mockRepo = $this->getMockBuilder(\FusionERP\Modules\Finance\FinanceRepository::class)
            ->disableOriginalConstructor()
            ->getMock();
        $mockRepo->expects($this->once())
            ->method('createEntry')
            ->willReturn('JE_test123');

        $service = new \FusionERP\Modules\Finance\FinanceService($mockRepo);

        $result = $service->createEntry([
            'description' => 'Quota associativa',
            'entry_date' => '2026-01-15',
            'lines' => [
                ['account_id' => 'A1', 'debit' => 500, 'credit' => 0],
                ['account_id' => 'A2', 'debit' => 0, 'credit' => 500],
            ]
        ], 'user_123');

        $this->assertEquals('JE_test123', $result);
    }

    public function testCreateEntryIeee754FloatingPointTolerance(): void
    {
        // Real IEEE 754 issue: 0.1 + 0.2 = 0.30000000000000004 in float math
        // The service uses abs(debit - credit) > 0.001 as threshold
        // This test verifies the tolerance works with actual floating-point inaccuracies
        $mockRepo = $this->getMockBuilder(\FusionERP\Modules\Finance\FinanceRepository::class)
            ->disableOriginalConstructor()
            ->getMock();
        $mockRepo->method('createEntry')->willReturn('JE_float');

        $service = new \FusionERP\Modules\Finance\FinanceService($mockRepo);

        // debit sum = 0.1 + 0.2 = 0.30000000000000004 (IEEE 754)
        // credit sum = 0.3
        // delta = 4.44e-17 → well below 0.001 tolerance → MUST pass
        $result = $service->createEntry([
            'description' => 'IEEE 754 edge case',
            'entry_date' => '2026-01-15',
            'lines' => [
                ['account_id' => 'A1', 'debit' => 0.1, 'credit' => 0],
                ['account_id' => 'A2', 'debit' => 0.2, 'credit' => 0],
                ['account_id' => 'A3', 'debit' => 0, 'credit' => 0.3],
            ]
        ], 'user_123');

        $this->assertEquals('JE_float', $result);
    }

    public function testCreateEntryMissingLinesKey(): void
    {
        $this->expectException(\Exception::class);

        // 'lines' key missing entirely from $data
        $this->service->createEntry([
            'description' => 'Test entry',
            'entry_date' => '2026-01-15',
            // no 'lines' key at all
        ], 'user_123');
    }

    public function testCreateEntryEmptyLinesArray(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('min. 2 righe');

        $this->service->createEntry([
            'description' => 'Test entry',
            'entry_date' => '2026-01-15',
            'lines' => [],
        ], 'user_123');
    }
}
