<?php
/*
 * Średnik by .dot – odbiór formularza kontaktowego.
 * Wysyła zgłoszenie e-mailem i odpowiada w JSON (strona czyta tylko kod HTTP).
 * Wymaga hostingu z PHP i włączoną funkcją mail().
 */
declare(strict_types=1);

const RECIPIENT = 'sebastian.biel@me.com';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function cut(string $value, int $max): string
{
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

// Jedna linia: bez znaków nowej linii i NUL, żeby nie dało się wstrzyknąć nagłówków.
function one_line($value, int $max): string
{
    return cut(trim(preg_replace('/[\r\n\0]+/', ' ', (string) $value)), $max);
}

function mime_header(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false]);
}

// Pole-pułapka niewidoczne dla ludzi: boty je wypełniają, udajemy sukces.
if (!empty($_POST['firma_www'])) {
    respond(200, ['ok' => true]);
}

$site    = one_line($_POST['strona'] ?? '', 300);
$email   = one_line($_POST['email'] ?? '', 254);
$message = cut(trim(str_replace("\0", '', (string) ($_POST['wiadomosc'] ?? ''))), 5000);

if ($site === '' || preg_match('/\s/', $site) || !preg_match('/[^.\s]\.[a-z]{2,}/i', $site)) {
    respond(422, ['ok' => false, 'field' => 'strona']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'field' => 'email']);
}

$host = preg_replace('/[^a-z0-9.-]/i', '', (string) ($_SERVER['SERVER_NAME'] ?? 'localhost'));
$host = preg_replace('/^www\./i', '', $host) ?: 'localhost';

$subject = 'Nowe zgłoszenie do audytu: ' . $site;
$body = "Nowe zgłoszenie z formularza na stronie Średnik.\n\n"
      . "Adres strony: {$site}\n"
      . "E-mail: {$email}\n\n"
      . "Co przeszkadza w stronie:\n" . ($message !== '' ? $message : '(nie podano)') . "\n\n"
      . '---' . "\nWysłano: " . date('Y-m-d H:i') . "\n";

$headers = [
    'From: ' . mime_header('Średnik – formularz') . " <no-reply@{$host}>",
    "Reply-To: {$email}",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$sent = mail(RECIPIENT, mime_header($subject), $body, implode("\r\n", $headers));

respond($sent ? 200 : 500, ['ok' => $sent]);
