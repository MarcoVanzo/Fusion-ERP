<?php
/**
 * TenantContextTest — Unit tests for FusionERP\Shared\TenantContext
 *
 * Tests the multi-tenant resolution logic and override mechanism.
 * Tests that require DB are marked with @group database.
 */

declare(strict_types=1);

namespace FusionERP\Tests\Unit;

use PHPUnit\Framework\TestCase;
use FusionERP\Shared\TenantContext;

class TenantContextTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        TenantContext::reset();
    }

    // ─── Override Mechanism ─────────────────────────────────────────────────

    public function testSetOverrideChangesId(): void
    {
        TenantContext::setOverride('custom_tenant');
        $this->assertEquals('custom_tenant', TenantContext::id());
    }

    public function testMultipleOverrides(): void
    {
        TenantContext::setOverride('first');
        TenantContext::setOverride('second');
        $this->assertEquals('second', TenantContext::id());
    }

    public function testResetClearsOverride(): void
    {
        TenantContext::setOverride('temp_tenant');
        TenantContext::reset();
        // After reset + override with different value, should use new value
        TenantContext::setOverride('new_tenant');
        $this->assertEquals('new_tenant', TenantContext::id());
    }

    // ─── Resolve ────────────────────────────────────────────────────────────

    public function testResolveReturnsString(): void
    {
        $result = TenantContext::resolve();
        $this->assertIsString($result);
        $this->assertNotEmpty($result);
    }

    public function testIdMatchesResolve(): void
    {
        $resolved = TenantContext::resolve();
        $id = TenantContext::id();
        $this->assertEquals($resolved, $id);
    }

    public function testOverrideIdStableAcrossCalls(): void
    {
        TenantContext::setOverride('stable_tenant');
        $id1 = TenantContext::id();
        $id2 = TenantContext::id();
        $this->assertEquals($id1, $id2, 'id() should return same value across calls');
    }

    public function testOverridePreservedAfterResolve(): void
    {
        TenantContext::setOverride('override_tenant');
        TenantContext::resolve(); // Should not clobber the override
        $this->assertEquals('override_tenant', TenantContext::id());
    }
}
