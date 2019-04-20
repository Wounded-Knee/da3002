echo "Refreshing test database";
mysql -u da3002-test da3002-test < schema.sql;
mysql -u da3002-test da3002-test < data.sql;

echo "Starting unit tests";
node_modules/mocha/bin/mocha;
