<?php
declare(strict_types=1);

namespace FusionERP\Shared;

class Security
{
    public static function generateTempPassword(int $length = 14): string
    {
        $chars_lower = 'abcdefghjkmnpqrstuvwxyz';
        $chars_upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $chars_digit = '23456789';
        $chars_special = '!@#$%^&*()';
        $all_chars = $chars_lower . $chars_upper . $chars_digit . $chars_special;

        try {
            $pass = $chars_lower[random_int(0, strlen($chars_lower) - 1)]
                . $chars_upper[random_int(0, strlen($chars_upper) - 1)]
                . $chars_digit[random_int(0, strlen($chars_digit) - 1)]
                . $chars_special[random_int(0, strlen($chars_special) - 1)];
            for ($i = 4; $i < $length; $i++) {
                $pass .= $all_chars[random_int(0, strlen($all_chars) - 1)];
            }
            
            $passArr = str_split($pass);
            for ($i = count($passArr) - 1; $i > 0; $i--) {
                $j = random_int(0, $i);
                [$passArr[$i], $passArr[$j]] = [$passArr[$j], $passArr[$i]];
            }
            return implode('', $passArr);
        } catch (\Exception $e) {
            return substr(str_shuffle($all_chars), 0, $length);
        }
    }

    public static function validatePasswordComplexity(string $password): bool
    {
        return strlen($password) >= 12 &&
            preg_match('/[A-Z]/', $password) &&
            preg_match('/[a-z]/', $password) &&
            preg_match('/[0-9]/', $password) &&
            preg_match('/[^A-Za-z0-9]/', $password);
    }

    private static function base64url_encode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generateJWT(array $payload): string
    {
        $secret = getenv('APP_SECRET');
        $header = self::base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        
        $payload['iat'] = time();
        $payload['exp'] = time() + 86400 * 30; // 30 days
        $payload['jti'] = bin2hex(random_bytes(16));

        $payloadEncoded = self::base64url_encode(json_encode($payload));
        $signature = self::base64url_encode(hash_hmac('sha256', "$header.$payloadEncoded", $secret, true));

        return "$header.$payloadEncoded.$signature";
    }

    public static function validateJWT(string $token): ?array
    {
        $secret = getenv('APP_SECRET');
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        list($header, $payload, $signature) = $parts;
        $expectedSignature = self::base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));

        if (!hash_equals($expectedSignature, $signature)) return null;

        $data = json_decode(self::base64url_decode($payload), true);
        if (!$data || (isset($data['exp']) && time() > $data['exp'])) return null;

        return $data;
    }
}
