import bcrypt from "bcryptjs";
import readline from "readline";

async function main() {
  const args = process.argv.slice(2);
  let passphrase = args[0];

  if (!passphrase) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    passphrase = await new Promise<string>((resolve) => {
      rl.question("Enter Admin Passphrase to hash: ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  if (!passphrase) {
    console.error("❌ Error: Passphrase cannot be empty.");
    process.exit(1);
  }

  const saltRounds = 12;
  const hash = await bcrypt.hash(passphrase, saltRounds);

  console.log("\n✅ Generated ADMIN_PASSPHRASE_HASH (bcrypt):");
  console.log("--------------------------------------------------");
  console.log(hash);
  console.log("--------------------------------------------------");
  console.log("\nCopy this value and set it in your Vercel / Production environment variables:\n");
  console.log(`ADMIN_PASSPHRASE_HASH="${hash}"\n`);
}

main().catch(console.error);
