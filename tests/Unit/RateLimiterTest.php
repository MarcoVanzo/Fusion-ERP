<?php
/**
 * RateLimiterTest — Test unitari per FusionERP\Shared\RateLimiter
 */

declare(strict_types=1);

namespace FusionERP\Tests\Unit;

use PHPUnit\Framework\TestCase;
use FusionERP\Shared\RateLimiter;

class RateLimiterTest extends TestCase
{
    private string $testKey;

    protected function setUp(): void
    {
        // Use a unique key per test to avoid interference
        $this->testKey = 'test_' . uniqid();
    }

    protected function tearDown(): void
    {
        // Cleanup: remove the rate limiter file
        $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fusion_rl_{$this->testKey}.json";
        if (file_exists($file)) {
            @unlink($file);
        }
    }

    public function testNormalRequestPassesWithinLimit(): void
    {
        // 5 requests with a limit of 10 should all pass
        for ($i = 0; $i < 5; $i++) {
            RateLimiter::check($this->testKey, 10, 60);
        }
        // If we got here without an exception/exit, it passed
        $this->assertTrue(true);
    }

    public function testFileIsCreated(): void
    {
        RateLimiter::check($this->testKey, 100, 60);

        $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fusion_rl_{$this->testKey}.json";
        $this->assertFileExists($file);

        $data = json_decode(file_get_contents($file), true);
        $this->assertIsArray($data);
        $this->assertCount(1, $data);
    }

    public function testTimestampsAccumulate(): void
    {
        RateLimiter::check($this->testKey, 100, 60);
        RateLimiter::check($this->testKey, 100, 60);
        RateLimiter::check($this->testKey, 100, 60);

        $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fusion_rl_{$this->testKey}.json";
        $data = json_decode(file_get_contents($file), true);
        $this->assertCount(3, $data);
    }

    public function testSafeKeyCharacters(): void
    {
        // Should not crash with special characters
        $key = '192.168.1.1_auth';
        RateLimiter::check($key, 100, 60);
        $this->assertTrue(true);

        // Cleanup
        $safeKey = preg_replace('/[^a-zA-Z0-9_.\-]/', '_', $key);
        @unlink(sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fusion_rl_{$safeKey}.json");
    }
}
