curl -v -c cookie.txt -X POST http://localhost:8000/fusion-erp/api/router.php?module=auth\&action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fusion.it","password":"password"}'

echo "\n--- TASKS FETCH ---"

curl -v -b cookie.txt -X GET "http://localhost:8000/fusion-erp/api/router.php?module=tasks&action=listTasks"
