FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ARG APP_UID=1000
ARG APP_GID=1000
RUN addgroup --gid $APP_GID appgroup && \
    adduser --disabled-password --gecos "" --uid $APP_UID --gid $APP_GID appuser

USER appuser
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# ? SIMPLE: Copy everything first, then restore
COPY . .

# Restore packages (auto-discovers all projects)
RUN dotnet restore "src/Zentry.API/Zentry.API.csproj"

# Build
WORKDIR "/src/src/Zentry.API"
RUN dotnet build "./Zentry.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Zentry.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Zentry.API.dll"]
