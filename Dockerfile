# Stage 1: Build file .jar bằng Maven Wrapper
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy các file cấu hình maven vào trước
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Cấp quyền thực thi cho file mvnw (rất quan trọng khi chạy trên cloud)
RUN chmod +x ./mvnw

# Tải dependencies (giúp cache lại thư viện nếu code không đổi)
RUN ./mvnw dependency:go-offline

# Copy toàn bộ code vào và build
COPY src src
RUN ./mvnw clean package -DskipTests

# Stage 2: Chạy ứng dụng (Chỉ lấy file .jar để Image nhẹ nhất có thể)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy file jar từ Stage 1 sang Stage 2
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar app.jar

# Expose cổng 8080 
EXPOSE 8080

# Lệnh khởi chạy Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]
