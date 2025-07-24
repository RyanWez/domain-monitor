const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'Domain25@#';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Verify the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid);
    
    // Verify with the hardcoded hash
    const hardcodedHash = '$2a$10$8KzaNdKIMyOkASCUqYSYGONjwBJtjUoU5i8gxA1xUHlP3FQpKEVey';
    const isValidHardcoded = await bcrypt.compare(password, hardcodedHash);
    console.log('Hardcoded hash verification:', isValidHardcoded);
  } catch (error) {
    console.error('Error:', error);
  }
}

hashPassword();