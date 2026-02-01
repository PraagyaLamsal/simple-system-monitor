function bytesToGB(bytes){return +(bytes/(1024**3)).toFixed(2);} 
function bytesToMB(bytes){return +(bytes/(1024**2)).toFixed(2);} 
module.exports={bytesToGB,bytesToMB};
