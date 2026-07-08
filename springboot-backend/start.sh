#!/bin/bash
echo "Starting build..."
mvn clean package -DskipTests
echo "Build complete! Starting application..."
java -Xmx512m -jar target/investment-research-api-1.0.0.jar
