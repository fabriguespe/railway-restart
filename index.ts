require("dotenv").config(); // Add this line at the top

const fetch = require("node-fetch");
const cron = require("node-cron");

const RAILWAY_API_URL = "https://backboard.railway.app/graphql/v2";

async function getDeploymentIds() {
  const response = await fetch(RAILWAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
          query deployments {
            deployments(
              input: {
                projectId: "ae977175-7a24-456e-8958-d1a5022afac5"
                environmentId: "fdef8588-7ec0-45fd-b7f9-8ab938727849"
                
              }
            ) {
              edges {
                node {
                  id
                  staticUrl
                  status
                }
              }
            }
          }
        `,
    }),
  });
  const result = await response.json();
  return result.data.deployments.edges
    .map((edge: any) => edge.node.id)
    .filter((id: string) =>
      result.data.deployments.edges.find(
        (edge: any) => edge.node.id === id && edge.node.status === "SUCCESS"
      )
    );
}

async function restartDeployment(deploymentId: string) {
  const response = await fetch(RAILWAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
  mutation deploymentRestart {
    deploymentRestart(id: "${deploymentId}")
  }
`,
    }),
  });
  const result = await response.json();
}

cron.schedule("0 0 * * *", async () => {
  const deploymentIds = await getDeploymentIds();
  for (const deploymentId of deploymentIds) {
    console.log("Restarting " + deploymentId);
    await restartDeployment(deploymentId);
  }
  console.log("Done");
});
