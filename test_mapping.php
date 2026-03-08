<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Include the controller but we need to mock DB dependencies if it runs them on load.
// Wait, EcommerceController is just static methods. We can include it directly.
require_once 'api/Modules/Ecommerce/EcommerceController.php';

$json = '{
    "Name": "Lavinia Vidori",
    "Email": "aviezzer77@gmail.com",
    "Phone": "3341146197",
    "ComeVuoiRicevereIlTuoOrdine": "Ritiro in sede",
    "InserisciIlNomeDelTuoAllenatore": null,
    "ComeVuoiPagare": "On line",
    "Entry_DateSubmitted": "2025-11-27T18:40:56.558Z",
    "Entry_Status": "Submitted",
    "Order_Date": "2025-11-27T18:40:56.553Z",
    "Order_Id": "F17E1T1",
    "Order_OrderSummary": "80,00 \u20ac Paid",
    "Order_PaymentMethod": "MasterCard",
    "Order_PaymentStatus": "Paid",
    "Id": 1
}';

$entry = json_decode($json, true);

// Use Reflection to access private method
$class = new ReflectionClass('Modules\Ecommerce\EcommerceController');
$method = $class->getMethod('_normalizeOrder');
$method->setAccessible(true);

$result = $method->invokeArgs(null, [$entry]);
echo json_encode($result, JSON_PRETTY_PRINT);
