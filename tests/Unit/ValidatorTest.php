<?php
/**
 * ValidatorTest — Test unitari per FusionERP\Shared\Validator
 */

declare(strict_types=1);

namespace FusionERP\Tests\Unit;

use PHPUnit\Framework\TestCase;
use FusionERP\Shared\Validator;

class ValidatorTest extends TestCase
{
    // ─── Required ────────────────────────────────────────────────────────────

    public function testRequiredFieldPresent(): void
    {
        $v = Validator::make(['name' => 'Marco']);
        $v->required('name');
        $this->assertTrue($v->passes());
    }

    public function testRequiredFieldMissing(): void
    {
        $v = Validator::make([]);
        $v->required('name');
        $this->assertFalse($v->passes());
        $this->assertStringContainsString("'name'", $v->getErrors()[0]);
    }

    public function testRequiredFieldEmpty(): void
    {
        $v = Validator::make(['name' => '']);
        $v->required('name');
        $this->assertFalse($v->passes());
    }

    // ─── Email ───────────────────────────────────────────────────────────────

    public function testValidEmail(): void
    {
        $v = Validator::make(['email' => 'test@example.com']);
        $v->email('email');
        $this->assertTrue($v->passes());
    }

    public function testInvalidEmail(): void
    {
        $v = Validator::make(['email' => 'not-an-email']);
        $v->email('email');
        $this->assertFalse($v->passes());
    }

    public function testEmailSkipsEmpty(): void
    {
        $v = Validator::make(['email' => '']);
        $v->email('email');
        $this->assertTrue($v->passes(), 'Email validation should skip empty values');
    }

    // ─── String Length ────────────────────────────────────────────────────────

    public function testStringWithinBounds(): void
    {
        $v = Validator::make(['name' => 'Marco']);
        $v->string('name', 2, 100);
        $this->assertTrue($v->passes());
    }

    public function testStringTooShort(): void
    {
        $v = Validator::make(['name' => 'A']);
        $v->string('name', 2, 100);
        $this->assertFalse($v->passes());
    }

    public function testStringTooLong(): void
    {
        $v = Validator::make(['name' => str_repeat('x', 256)]);
        $v->string('name', 1, 255);
        $this->assertFalse($v->passes());
    }

    // ─── Numeric ─────────────────────────────────────────────────────────────

    public function testNumericValid(): void
    {
        $v = Validator::make(['amount' => '42.5']);
        $v->numeric('amount');
        $this->assertTrue($v->passes());
    }

    public function testNumericInvalid(): void
    {
        $v = Validator::make(['amount' => 'abc']);
        $v->numeric('amount');
        $this->assertFalse($v->passes());
    }

    // ─── Integer ─────────────────────────────────────────────────────────────

    public function testIntegerValid(): void
    {
        $v = Validator::make(['count' => '10']);
        $v->integer('count');
        $this->assertTrue($v->passes());
    }

    public function testIntegerInvalidFloat(): void
    {
        $v = Validator::make(['count' => '10.5']);
        $v->integer('count');
        $this->assertFalse($v->passes());
    }

    // ─── Date ────────────────────────────────────────────────────────────────

    public function testDateValid(): void
    {
        $v = Validator::make(['date' => '2025-12-31']);
        $v->date('date');
        $this->assertTrue($v->passes());
    }

    public function testDateInvalidFormat(): void
    {
        $v = Validator::make(['date' => '31/12/2025']);
        $v->date('date');
        $this->assertFalse($v->passes());
    }

    public function testDateInvalidDay(): void
    {
        $v = Validator::make(['date' => '2025-02-30']);  // Feb 30 doesn't exist
        $v->date('date');
        $this->assertFalse($v->passes());
    }

    // ─── In (Enum) ───────────────────────────────────────────────────────────

    public function testInAllowedValue(): void
    {
        $v = Validator::make(['role' => 'admin']);
        $v->in('role', ['admin', 'staff', 'atleta']);
        $this->assertTrue($v->passes());
    }

    public function testInDisallowedValue(): void
    {
        $v = Validator::make(['role' => 'hacker']);
        $v->in('role', ['admin', 'staff', 'atleta']);
        $this->assertFalse($v->passes());
    }

    // ─── Boolean ─────────────────────────────────────────────────────────────

    public function testBooleanValid(): void
    {
        $v = Validator::make(['active' => '1']);
        $v->boolean('active');
        $this->assertTrue($v->passes());
    }

    public function testBooleanInvalid(): void
    {
        $v = Validator::make(['active' => 'maybe']);
        $v->boolean('active');
        $this->assertFalse($v->passes());
    }

    // ─── Chaining ────────────────────────────────────────────────────────────

    public function testChainingMultipleRules(): void
    {
        $v = Validator::make([
            'email' => 'user@test.com',
            'name'  => 'Marco Rossi',
            'role'  => 'admin'
        ]);

        $v->required('email')
          ->email('email')
          ->required('name')
          ->string('name', 2, 100)
          ->required('role')
          ->in('role', ['admin', 'staff', 'atleta']);

        $this->assertTrue($v->passes());
        $this->assertEmpty($v->getErrors());
    }

    public function testChainingCollectsAllErrors(): void
    {
        $v = Validator::make([
            'email' => 'bad-email',
            'name'  => 'X'
        ]);

        $v->required('email')
          ->email('email')
          ->required('name')
          ->string('name', 3, 100)
          ->required('role');

        $this->assertFalse($v->passes());
        // Should have 3 errors: invalid email, name too short, role missing
        $this->assertCount(3, $v->getErrors());
    }
}
