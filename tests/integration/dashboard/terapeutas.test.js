import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /Dashboard/Terapeutas", () => {
  test("Should return status 200 when accessing page", async () => {
    const response = await fetch("http://localhost:3000/Dashboard/Terapeutas");
    expect(response.status).toBe(200);
  });
});

// const terapeutasPage = "http://localhost:3000/Dashboard/Terapeutas";
// const api = "http://localhost:3000/api/v1/terapeutas";

// beforeAll(async () => {
//   await orchestrator.waitForAllServices();
// });

// describe("GET /Dashboard/Terapeutas", () => {
//   test("Should return status 200 when accessing page", async () => {
//     const response = await fetch(terapeutasPage);
//     expect(response.status).toBe(200);
//   });
// });

// describe("GET /api/v1/terapeutas", () => {
//   test("Should return status 200 and data from API", async () => {
//     const response = await fetch(api);
//     expect(response.status).toBe(200);

//     const responseBody = await response.json();
//     expect(Array.isArray(responseBody)).toBe(true);

//     // Validate response data structure
//     expect(responseBody.length).toBeGreaterThanOrEqual(0);
//     const firstItem = responseBody[0] || {};
//     const requiredProperties = [
//       "id",
//       "nomeTerapeuta",
//       "telefoneTerapeuta",
//       "emailTerapeuta",
//       "enderecoTerapeuta",
//       "dtEntrada",
//       "chavePix",
//     ];
//     requiredProperties.forEach((prop) => {
//       expect(firstItem).toHaveProperty(prop);
//     });
//   });
// });
