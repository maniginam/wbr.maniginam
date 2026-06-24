// POST subscribe -> DynamoDB (wbr-subscribers). Invoked via Lambda Function URL.
// CORS + OPTIONS preflight are handled by the Function URL's CORS config.
// AWS SDK v3 is bundled in the nodejs20.x runtime (no node_modules needed).
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = "wbr-subscribers";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function res(code, body) {
  return { statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  if (event?.requestContext?.http?.method !== "POST") {
    return res(405, { ok: false, error: "method_not_allowed" });
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return res(400, { ok: false, error: "invalid_json" });
  }

  // Honeypot: real users never fill this. Pretend success so bots learn nothing.
  if (data.company) return res(200, { ok: true });

  const name = String(data.name || "").trim().slice(0, 120);
  const email = String(data.email || "").trim().toLowerCase().slice(0, 254);
  const source = String(data.source || "").trim().slice(0, 120);

  if (!name || !EMAIL_RE.test(email)) {
    return res(422, { ok: false, error: "invalid_input" });
  }

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { email, name, source, created_at: new Date().toISOString() },
    }));
  } catch {
    return res(500, { ok: false, error: "db_error" });
  }

  return res(200, { ok: true });
};
