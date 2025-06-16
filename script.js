document.getElementById("saveBtn").addEventListener("click", async () => {
  const text = document.getElementById("editor").value;
  
  // Create and download file since we can't use server-side PHP in static deployment
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'edited-content.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  document.getElementById("status").textContent = "✅ File downloaded!";
});
