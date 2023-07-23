module.exports = {
    makeid,
  }

  
  function makeid() {
   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
   let randomString = '';
 
   for (let i = 0; i < 5; i++) {
     const randomIndex = Math.floor(Math.random() * characters.length);
     randomString += characters.charAt(randomIndex);
   }
 
   return randomString;
  }