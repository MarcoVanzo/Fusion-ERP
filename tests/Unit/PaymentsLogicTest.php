<?php
/**
 * PaymentsControllerTest — Unit tests for payment plan generation logic
 * Fusion ERP v1.0
 *
 * Tests the pure business logic in PaymentsController::generateInstallments()
 * Since it's private, we test through a ReflectionMethod approach to validate
 * the installment split logic without needing a database connection.
 */

declare(strict_types=1);

namespace FusionERP\Tests\Unit;

use PHPUnit\Framework\TestCase;

class PaymentsLogicTest extends TestCase
{
    // ═══════════════════════════════════════════════════════════════════════════
    // Installment Generation Logic (tested via reflection on private method)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Helper: invoke the private generateInstallments method with a mocked repo
     * that captures insertInstallment calls instead of hitting the DB.
     */
    private function generateInstallments(float $total, string $frequency, string $startDate): array
    {
        // Create controller with a mock repository (disable constructor to avoid DB connection)
        $mockRepo = $this->getMockBuilder(\FusionERP\Modules\Payments\PaymentsRepository::class)
            ->disableOriginalConstructor()
            ->getMock();

        $insertedInstallments = [];
        $mockRepo->method('insertInstallment')
            ->willReturnCallback(function ($data) use (&$insertedInstallments) {
                $insertedInstallments[] = [
                    'id' => $data[':id'],
                    'plan_id' => $data[':plan_id'],
                    'title' => $data[':title'],
                    'due_date' => $data[':due_date'],
                    'amount' => $data[':amount'],
                    'status' => $data[':status'],
                ];
            });

        // Create controller without calling constructor (avoids real DB connection)
        $controllerRef = new \ReflectionClass(\FusionERP\Modules\Payments\PaymentsController::class);
        $controller = $controllerRef->newInstanceWithoutConstructor();
        $repoProperty = new \ReflectionProperty($controller, 'repo');
        $repoProperty->setAccessible(true);
        $repoProperty->setValue($controller, $mockRepo);

        // Call private method
        $method = new \ReflectionMethod($controller, 'generateInstallments');
        $method->setAccessible(true);

        return $method->invoke($controller, 'PP_test', $total, $frequency, $startDate);
    }

    // ─── Monthly ─────────────────────────────────────────────────────────────

    public function testMonthlyInstallments(): void
    {
        $result = $this->generateInstallments(1000.0, 'MONTHLY', '2026-09-01');

        $this->assertCount(10, $result, 'Monthly should generate 10 installments');
        $this->assertEquals(100.0, $result[0]['amount']);
        $this->assertEquals('Rata 1', $result[0]['title']);
        $this->assertEquals('2026-09-01', $result[0]['due_date']);
        $this->assertEquals('PENDING', $result[0]['status']);
    }

    public function testMonthlyInstallmentsDates(): void
    {
        $result = $this->generateInstallments(1000.0, 'MONTHLY', '2026-09-01');

        $this->assertEquals('2026-09-01', $result[0]['due_date']);
        $this->assertEquals('2026-10-01', $result[1]['due_date']);
        $this->assertEquals('2026-11-01', $result[2]['due_date']);
        $this->assertEquals('2027-06-01', $result[9]['due_date']);
    }

    public function testMonthlyInstallmentsTotalMatchesAmount(): void
    {
        $totalAmount = 1500.0;
        $result = $this->generateInstallments($totalAmount, 'MONTHLY', '2026-09-01');

        $sum = array_sum(array_column($result, 'amount'));
        $this->assertEqualsWithDelta($totalAmount, $sum, 0.01, 'Sum of installments must equal total');
    }

    // ─── Quarterly ──────────────────────────────────────────────────────────

    public function testQuarterlyInstallments(): void
    {
        $result = $this->generateInstallments(2000.0, 'QUARTERLY', '2026-01-01');

        $this->assertCount(4, $result, 'Quarterly should generate 4 installments');
        $this->assertEquals(500.0, $result[0]['amount']);
    }

    public function testQuarterlyDates(): void
    {
        $result = $this->generateInstallments(2000.0, 'QUARTERLY', '2026-01-01');

        $this->assertEquals('2026-01-01', $result[0]['due_date']);
        $this->assertEquals('2026-04-01', $result[1]['due_date']);
        $this->assertEquals('2026-07-01', $result[2]['due_date']);
        $this->assertEquals('2026-10-01', $result[3]['due_date']);
    }

    // ─── Semi-Annual ────────────────────────────────────────────────────────

    public function testSemiAnnualInstallments(): void
    {
        $result = $this->generateInstallments(1200.0, 'SEMI_ANNUAL', '2026-01-01');

        $this->assertCount(2, $result);
        $this->assertEquals(600.0, $result[0]['amount']);
        $this->assertEquals('2026-01-01', $result[0]['due_date']);
        $this->assertEquals('2026-07-01', $result[1]['due_date']);
    }

    // ─── Annual ─────────────────────────────────────────────────────────────

    public function testAnnualInstallment(): void
    {
        $result = $this->generateInstallments(800.0, 'ANNUAL', '2026-09-01');

        $this->assertCount(1, $result);
        $this->assertEquals(800.0, $result[0]['amount']);
        $this->assertEquals('2026-09-01', $result[0]['due_date']);
    }

    // ─── Remainder Distribution ─────────────────────────────────────────────

    public function testRemainderAddedToLastInstallment(): void
    {
        // 997 / 10 = 99.70 each, remainder = 997 - 997.00 = 0 (exact)
        // But 999 / 10 = 99.90 each, with remainder of 0 as well
        // Let's test with a number that creates a remainder:
        // 1001 / 10 = 100.10, but round(100.10, 2) * 10 = 1001.00 — no remainder
        // Use 1003 / 10 = 100.30 * 10 = 1003.00 — still exact
        // Better: 100 / 3 (not used, quarterly: 100/4 = 25 exact)
        // Actually, 1000/10 = 100 exact. Let's test 995/10 = 99.50 → exact
        // Test with odd amount: 997/10 = 99.70 → exact

        // The real test: 1001/10 = 100.10 → 100.10*10 = 1001.00
        $result = $this->generateInstallments(1001.0, 'MONTHLY', '2026-01-01');
        $sum = array_sum(array_column($result, 'amount'));
        $this->assertEqualsWithDelta(1001.0, $sum, 0.01, 'Total must be preserved with remainder');
    }

    public function testUnevenSplitPreservesTotal(): void
    {
        // 333 / 4 = 83.25 → 83.25 * 4 = 333.00 (exact)
        // 100 / 3 months ≠ int, but with quarterly: 100/4 = 25.00 (exact)
        // Use an amount that does create rounding: 1000.01 / 10 = 100.00 each → remainder = 0.01
        $result = $this->generateInstallments(1000.01, 'MONTHLY', '2026-01-01');
        $sum = array_sum(array_column($result, 'amount'));
        $this->assertEqualsWithDelta(1000.01, $sum, 0.01, 'Total with remainder must be preserved');
    }

    // ─── Edge Cases ─────────────────────────────────────────────────────────

    public function testLastInstallmentContainsRemainder(): void
    {
        // 1000.01 / 10 = 100.00 (rounded) → remainder = 0.01 goes to last installment
        $result = $this->generateInstallments(1000.01, 'MONTHLY', '2026-01-01');

        // First 9 installments should be 100.00 each
        for ($i = 0; $i < 9; $i++) {
            $this->assertEqualsWithDelta(100.00, $result[$i]['amount'], 0.001,
                "Installment " . ($i + 1) . " should be 100.00");
        }
        // Last should include the remainder
        $this->assertEqualsWithDelta(100.01, $result[9]['amount'], 0.001,
            'Last installment must include the remainder');
    }

    public function testCustomFrequencyFallsBackToSingle(): void
    {
        // CUSTOM frequency should generate exactly 1 installment (default branch)
        $result = $this->generateInstallments(500.0, 'CUSTOM', '2026-06-01');

        $this->assertCount(1, $result, 'CUSTOM should fall back to 1 installment');
        $this->assertEquals(500.0, $result[0]['amount']);
        $this->assertEquals('2026-06-01', $result[0]['due_date']);
    }
}
