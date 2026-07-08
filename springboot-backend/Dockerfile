# Build stage
FROM maven:3.9.6-eclipse-temurin-17 as builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=builder /build/target/investment-research-api-1.0.0.jar .
EXPOSE 8080
CMD ["java", "-jar", "investment-research-api-1.0.0.jar"]
