<?php
/**
 * Validator — Structured Input Validation
 * Fusion ERP v1.0
 *
 * Fluent API for validating request payloads.
 *
 * Usage:
 *   $data = (new Validator($body))
 *       ->required('email')->email('email')
 *       ->required('full_name')->string('full_name', 2, 100)
 *       ->required('role')->in('role', ['admin', 'staff', 'atleta'])
 *       ->optional('phone')->string('phone', 0, 20)
 *       ->validate();
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class Validator
{
    private array $data;
    private array $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Create a new Validator instance from request body.
     */
    public static function make(array $data): self
    {
        return new self($data);
    }

    // ─── Rules ───────────────────────────────────────────────────────────────

    /**
     * Field must be present and non-empty.
     */
    public function required(string $field): self
    {
        $val = $this->data[$field] ?? null;
        if ($val === null || (is_string($val) && trim($val) === '')) {
            $this->errors[] = "'{$field}' è obbligatorio";
        }
        return $this;
    }

    /**
     * Mark field as optional — subsequent rules only apply if the field is present.
     */
    public function optional(string $field): self
    {
        // No-op: just returns $this so chaining reads well.
        // Subsequent rule methods should check if the field is actually present.
        return $this;
    }

    /**
     * Field must be a valid email address.
     */
    public function email(string $field): self
    {
        $val = $this->data[$field] ?? null;
        if ($val !== null && $val !== '' && !filter_var($val, FILTER_VALIDATE_EMAIL)) {
            $this->errors[] = "'{$field}' non è un indirizzo email valido";
        }
        return $this;
    }

    /**
     * Field must be a string within the given length bounds.
     */
    public function string(string $field, int $min = 1, int $max = 255): self
    {
        $val = $this->data[$field] ?? null;
        if ($val === null || $val === '') return $this; // Skip if empty (use required() for mandatory)

        if (!is_string($val)) {
            $this->errors[] = "'{$field}' deve essere una stringa";
            return $this;
        }

        $len = mb_strlen($val);
        if ($len < $min) {
            $this->errors[] = "'{$field}' deve avere almeno {$min} caratteri";
        }
        if ($len > $max) {
            $this->errors[] = "'{$field}' non può superare {$max} caratteri";
        }

        return $this;
    }

    /**
     * Field must be numeric (integer or float).
     */
    public function numeric(string $field): self
    {
        $val = $this->data[$field] ?? null;
        if ($val === null || $val === '') return $this;

        if (!is_numeric($val)) {
            $this->errors[] = "'{$field}' deve essere un valore numerico";
        }
        return $this;
    }

    /**
     * Field must be an integer.
     */
    public function integer(string $field): self
    {
        $val = $this->data[$field] ?? null;
        if ($val === null || $val === '') return $this;

        if (filter_var($val, FILTER_VALIDATE_INT) === false) {
            $this->errors[] = "'{$field}' deve essere un numero intero";
        }
        return $this;
    }

    /**
     * Field must be a valid date (YYYY-MM-DD).
     */
    public function date(string $field): self
    {
        $val = $this->data[$field] ?? null;
        if ($val === null || $val === '') return $this;

        $d = \DateTime::createFromFormat('Y-m-d', $val);
        if (!$d || $d->format('Y-m-d') !== $val) {
            $this->errors[] = "'{$field}' deve essere una data valida (AAAA-MM-GG)";
        }
        return $this;
    }

    /**
     * Field value must be one of the allowed values.
     */
    public function in(string $field, array $allowed): self
    {
        $val = $this->data[$field] ?? null;
        if ($val === null || $val === '') return $this;

        if (!in_array($val, $allowed, true)) {
            $this->errors[] = "'{$field}' deve essere uno dei valori: " . implode(', ', $allowed);
        }
        return $this;
    }

    /**
     * Field must be a boolean-ish value (true, false, 1, 0, "1", "0").
     */
    public function boolean(string $field): self
    {
        $val = $this->data[$field] ?? null;
        if ($val === null) return $this;

        if (filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === null) {
            $this->errors[] = "'{$field}' deve essere un valore booleano";
        }
        return $this;
    }

    // ─── Validate & Return ───────────────────────────────────────────────────

    /**
     * Run validation. If errors are found, sends a 422 response and exits.
     * Otherwise, returns the validated data.
     *
     * @return array The valid data
     */
    public function validate(): array
    {
        if (!empty($this->errors)) {
            Response::error(
                'Errore di validazione: ' . implode('; ', $this->errors),
                422
            );
        }
        return $this->data;
    }

    /**
     * Check if validation passed without sending a response.
     *
     * @return bool True if no errors
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Get the list of validation errors.
     *
     * @return string[]
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
