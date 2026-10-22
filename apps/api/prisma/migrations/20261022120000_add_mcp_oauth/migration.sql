CREATE TYPE "McpOAuthTokenType" AS ENUM ('ACCESS', 'REFRESH');

CREATE TABLE "McpOAuthClient" (
  "id" TEXT NOT NULL,
  "clientMetadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpOAuthClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "McpOAuthAuthorization" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "redirectUri" TEXT NOT NULL,
  "codeChallenge" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL,
  "resource" TEXT,
  "state" TEXT,
  "authorizationCodeHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP(3),
  CONSTRAINT "McpOAuthAuthorization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "McpOAuthAuthorization_authorizationCodeHash_key"
  ON "McpOAuthAuthorization"("authorizationCodeHash");
CREATE INDEX "McpOAuthAuthorization_expiresAt_idx"
  ON "McpOAuthAuthorization"("expiresAt");

CREATE TABLE "McpOAuthToken" (
  "tokenHash" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "tokenType" "McpOAuthTokenType" NOT NULL,
  "scopes" TEXT[] NOT NULL,
  "resource" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpOAuthToken_pkey" PRIMARY KEY ("tokenHash")
);

CREATE INDEX "McpOAuthToken_clientId_tokenType_idx"
  ON "McpOAuthToken"("clientId", "tokenType");
CREATE INDEX "McpOAuthToken_expiresAt_idx"
  ON "McpOAuthToken"("expiresAt");
