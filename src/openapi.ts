import { CATEGORIES } from "./categories";

/** OpenAPI 3.1 description of the service, generated from the live corpus. */
export function openApiDocument(origin: string, canonical: string): unknown {
  const slugs = CATEGORIES.map((category) => category.slug);
  const optional = (name: string, description: string) => ({
    name,
    in: "query",
    required: false,
    description,
    schema: { type: "string", maxLength: 64 },
  });

  return {
    openapi: "3.1.0",
    info: {
      title: "SignaaS",
      version: "1.0.0",
      description: "Signature as a Service: stylized sign-offs in JSON, plain text or HTML.",
      license: { name: "MIT" },
    },
    servers:
      origin === canonical
        ? [{ url: canonical, description: "Canonical origin" }]
        : [
            { url: canonical, description: "Canonical origin" },
            { url: origin, description: "This deployment" },
          ],
    paths: {
      "/{category}/{name}": {
        get: {
          operationId: "getSignature",
          summary: "Return a signature in the requested tone.",
          parameters: [
            {
              name: "category",
              in: "path",
              required: true,
              schema: { type: "string", enum: slugs },
            },
            { name: "name", in: "path", required: true, schema: { type: "string", maxLength: 64 } },
            optional("title", "Job title, appended to the attribution."),
            optional("company", "Company name, appended after the title."),
            optional("recipient", "Who the signature is addressed to."),
            {
              name: "format",
              in: "query",
              required: false,
              description: "Overrides the Accept header.",
              schema: { type: "string", enum: ["json", "text", "html"] },
            },
            optional("seed", "Pins the template choice for reproducible output."),
          ],
          responses: {
            "200": {
              description: "A signature.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Signature" },
                },
                "text/plain": { schema: { type: "string" } },
                "text/html": { schema: { type: "string" } },
              },
            },
            "404": {
              description: "Unknown category.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "429": {
              description: "Free-tier rate limit exceeded.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/categories": {
        get: {
          operationId: "listCategories",
          summary: "List every category, alias and template count.",
          responses: { "200": { description: "The category catalogue." } },
        },
      },
      "/health": {
        get: {
          operationId: "health",
          summary: "Liveness probe.",
          responses: { "200": { description: "Service is up." } },
        },
      },
    },
    components: {
      securitySchemes: {
        apiKey: { type: "http", scheme: "bearer", description: "Paid-tier key." },
      },
      schemas: {
        Signature: {
          type: "object",
          required: ["message", "subtitle"],
          properties: {
            message: { type: "string", examples: ["Per my last email,"] },
            subtitle: { type: "string", examples: ["— Alice"] },
          },
        },
        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            categories: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  };
}
