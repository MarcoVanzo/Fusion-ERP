<?php
/**
 * BaseRepositoryTest — Unit tests for FusionERP\Shared\BaseRepository
 *
 * Tests the abstract BaseRepository methods (buildWhereClause, buildParams,
 * and transaction flow) using a concrete test stub.
 *
 * NOTE: These tests require a database connection. Run with:
 *   vendor/bin/phpunit tests/Unit/BaseRepositoryTest.php
 */

declare(strict_types=1);

namespace FusionERP\Tests\Unit;

use PHPUnit\Framework\TestCase;
use FusionERP\Shared\BaseRepository;

/**
 * Concrete stub that exposes protected methods for testing.
 */
class StubRepository extends BaseRepository
{
    protected string $table = 'test_table';
    protected string $alias = 't';
    protected bool $softDelete = true;
    protected string $defaultOrderBy = 'name';
    protected string $defaultOrderDir = 'ASC';

    /**
     * Expose protected hasColumn for testing.
     */
    public function testHasColumn(string $table, string $column): bool
    {
        return $this->hasColumn($table, $column);
    }
}

class StubRepositoryNoSoftDelete extends BaseRepository
{
    protected string $table = 'test_table_hard';
    protected bool $softDelete = false;
}


class BaseRepositoryTest extends TestCase
{
    // ─── Constructor ─────────────────────────────────────────────────────────

    public function testConstructorSetsAlias(): void
    {
        // When alias is empty, it should default to first letter of table name
        $repo = new StubRepositoryNoSoftDelete();
        $reflection = new \ReflectionProperty($repo, 'alias');
        $reflection->setAccessible(true);
        $this->assertEquals('t', $reflection->getValue($repo));
    }

    public function testConstructorPreservesExplicitAlias(): void
    {
        $repo = new StubRepository();
        $reflection = new \ReflectionProperty($repo, 'alias');
        $reflection->setAccessible(true);
        $this->assertEquals('t', $reflection->getValue($repo));
    }

    // ─── SoftDelete Logic ────────────────────────────────────────────────────

    public function testSoftDeleteThrowsOnNonSoftDeleteTable(): void
    {
        $repo = new StubRepositoryNoSoftDelete();
        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('does not support soft-delete');
        $repo->softDeleteRecord('123');
    }

    // ─── Table Configuration ─────────────────────────────────────────────────

    public function testTablePropertyIsSet(): void
    {
        $repo = new StubRepository();
        $reflection = new \ReflectionProperty($repo, 'table');
        $reflection->setAccessible(true);
        $this->assertEquals('test_table', $reflection->getValue($repo));
    }

    public function testDefaultOrderBy(): void
    {
        $repo = new StubRepository();
        $reflection = new \ReflectionProperty($repo, 'defaultOrderBy');
        $reflection->setAccessible(true);
        $this->assertEquals('name', $reflection->getValue($repo));
    }

    // ─── BuildWhereClause (via Reflection) ───────────────────────────────────

    public function testBuildWhereClauseWithSoftDelete(): void
    {
        $repo = new StubRepository();
        $method = new \ReflectionMethod($repo, 'buildWhereClause');
        $method->setAccessible(true);

        $result = $method->invoke($repo, []);
        $this->assertEquals('deleted_at IS NULL', $result);
    }

    public function testBuildWhereClauseWithConditions(): void
    {
        $repo = new StubRepository();
        $method = new \ReflectionMethod($repo, 'buildWhereClause');
        $method->setAccessible(true);

        $result = $method->invoke($repo, ['status' => 'active', 'team_id' => '5']);
        $this->assertStringContainsString('deleted_at IS NULL', $result);
        $this->assertStringContainsString('`status` = :status', $result);
        $this->assertStringContainsString('`team_id` = :team_id', $result);
    }

    public function testBuildWhereClauseWithNullValue(): void
    {
        $repo = new StubRepository();
        $method = new \ReflectionMethod($repo, 'buildWhereClause');
        $method->setAccessible(true);

        $result = $method->invoke($repo, ['deleted_by' => null]);
        $this->assertStringContainsString('`deleted_by` IS NULL', $result);
    }

    public function testBuildWhereClauseWithoutSoftDelete(): void
    {
        $repo = new StubRepositoryNoSoftDelete();
        $method = new \ReflectionMethod($repo, 'buildWhereClause');
        $method->setAccessible(true);

        $result = $method->invoke($repo, []);
        $this->assertEquals('1=1', $result);
    }

    // ─── BuildParams ─────────────────────────────────────────────────────────

    public function testBuildParamsSkipsNull(): void
    {
        $repo = new StubRepository();
        $method = new \ReflectionMethod($repo, 'buildParams');
        $method->setAccessible(true);

        $result = $method->invoke($repo, ['name' => 'Marco', 'team' => null, 'status' => 'active']);
        $this->assertCount(2, $result);
        $this->assertEquals('Marco', $result[':name']);
        $this->assertEquals('active', $result[':status']);
        $this->assertArrayNotHasKey(':team', $result);
    }

    public function testBuildParamsStripsColonPrefix(): void
    {
        $repo = new StubRepository();
        $method = new \ReflectionMethod($repo, 'buildParams');
        $method->setAccessible(true);

        $result = $method->invoke($repo, [':name' => 'Marco']);
        $this->assertArrayHasKey(':name', $result);
        $this->assertEquals('Marco', $result[':name']);
    }
}
