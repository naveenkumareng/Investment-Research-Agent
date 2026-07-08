# Multi-stage build
FROM maven:3.9.6-eclipse-temurin-17-alpine as builder
WORKDIR /build
COPY springboot-backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY springboot-backend/src ./src
RUN mvn clean package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=builder /build/target/investment-research-api-1.0.0.jar .
EXPOSE 8080
CMD ["java", "-Xmx512m", "-jar", "investment-research-api-1.0.0.jar"]
