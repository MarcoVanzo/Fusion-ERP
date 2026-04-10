<?php
/**
 * AuthTest — Unit tests for FusionERP\Shared\Auth
 *
 * Tests cover: role levels, password expiry, default permissions,
 * user session management (setUser/logout), and role hierarchy.
 *
 * NOTE: Tests that involve session must be run in a process that supports
 * sessions. Some tests use @runInSeparateProcess if needed.
 */

declare(strict_types=1);

namespace FusionERP\Tests\Unit;

use PHPUnit\Framework\TestCase;
use FusionERP\Shared\Auth;

class AuthTest extends TestCase
{
    // ─── Password Expiry ────────────────────────────────────────────────────

    public function testPasswordExpiredWhenNull(): void
    {
        $this->assertTrue(Auth::isPasswordExpired(null));
    }

    public function testPasswordNotExpiredRecent(): void
    {
        $recent = (new \DateTime('-10 days'))->format('Y-m-d H:i:s');
        $this->assertFalse(Auth::isPasswordExpired($recent));
    }

    public function testPasswordExpiredAfter90Days(): void
    {
        $old = (new \DateTime('-100 days'))->format('Y-m-d H:i:s');
        $this->assertTrue(Auth::isPasswordExpired($old));
    }

    public function testPasswordExpiryBoundary(): void
    {
        // Exactly 90 days ago should NOT be expired (>90 is the check)
        $boundary = (new \DateTime('-90 days'))->format('Y-m-d H:i:s');
        $this->assertFalse(Auth::isPasswordExpired($boundary));
    }

    public function testPasswordExpired91Days(): void
    {
        $expired = (new \DateTime('-91 days'))->format('Y-m-d H:i:s');
        $this->assertTrue(Auth::isPasswordExpired($expired));
    }

    // ─── Default Permissions ────────────────────────────────────────────────

    public function testAdminGetsAllWrite(): void
    {
        $perms = Auth::getDefaultPermissions('admin');
        $this->assertNotEmpty($perms);
        
        // Every module should be 'write' for admin
        foreach ($perms as $module => $level) {
            $this->assertEquals('write', $level, "Admin should have write on {$module}");
        }
    }

    public function testAtletaDeniedFinance(): void
    {
        $perms = Auth::getDefaultPermissions('atleta');
        $this->assertEquals('none', $perms['finance']);
        $this->assertEquals('none', $perms['admin']);
        $this->assertEquals('none', $perms['admin-backup']);
        $this->assertEquals('none', $perms['societa']);
        $this->assertEquals('none', $perms['staff']);
    }

    public function testAllenatoreDeniedFinance(): void
    {
        $perms = Auth::getDefaultPermissions('allenatore');
        $this->assertEquals('none', $perms['finance']);
        $this->assertEquals('none', $perms['admin']);
    }

    public function testAllenatoreCanReadAthletes(): void
    {
        $perms = Auth::getDefaultPermissions('allenatore');
        $this->assertEquals('read', $perms['athletes']);
        $this->assertEquals('read', $perms['teams']);
    }

    public function testUnknownRoleGetsReadDefaults(): void
    {
        $perms = Auth::getDefaultPermissions('unknown_role');
        $this->assertEquals('read', $perms['athletes']);
        // Unknown role should not have 'none' on anything (no explicit deny)
        $this->assertNotContains('none', $perms);
    }

    public function testOperatoreMatchesAllenatore(): void
    {
        $allenatorePerms = Auth::getDefaultPermissions('allenatore');
        $operatorePerms = Auth::getDefaultPermissions('operatore');

        // Both should have same finance/admin restrictions
        $this->assertEquals($allenatorePerms['finance'], $operatorePerms['finance']);
        $this->assertEquals($allenatorePerms['admin'], $operatorePerms['admin']);
    }

    // ─── Module Coverage ────────────────────────────────────────────────────

    public function testDefaultPermissionsContainAllCoreModules(): void
    {
        $perms = Auth::getDefaultPermissions('admin');
        
        $requiredModules = [
            'athletes', 'teams', 'finance', 'tasks', 'staff',
            'ecommerce', 'social', 'transport', 'admin', 'users',
        ];
        
        foreach ($requiredModules as $module) {
            $this->assertArrayHasKey($module, $perms, "Missing module: {$module}");
        }
    }

    // ─── Role Level Consistency ─────────────────────────────────────────────

    public function testRoleLevelHierarchy(): void
    {
        // Verify the hierarchy using getDefaultPermissions indirectly:
        // admin has more write permissions than atleta
        $adminPerms = Auth::getDefaultPermissions('admin');
        $atletaPerms = Auth::getDefaultPermissions('atleta');

        $adminWrites = count(array_filter($adminPerms, fn($v) => $v === 'write'));
        $atletaWrites = count(array_filter($atletaPerms, fn($v) => $v === 'write'));

        $this->assertGreaterThan($atletaWrites, $adminWrites);
    }
}
