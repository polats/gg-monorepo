## Quick Start

1. Generate facilitator keypair:
   ```
      solana-keygen new --outfile facilitator-keypair.json
    ```
         
2. Copy and configure environment:
   ```
      cp env.example .env
    ```
    
    Update FACILITATOR_PRIVATE_KEY and MERCHANT_SOLANA_ADDRESS
    
3. Fund facilitator on devnet:
   ```
      solana airdrop 2 <FACILITATOR_PUBLIC_KEY> --url devnet
    ```
    
4. Build and start:
   ```
      npm run build
      npm start
    ```

5. Generate test client:
   ```
      npm run generate:client
   ```
    
    Fund it: `solana airdrop 1 <CLIENT_KEY> --url devnet`

6. Run tests:
   ```   
    npm test
    ```
    
    See README.md and SETUP.md for detailed documentation.