document.getElementById("saveBtn").addEventListener("click", async () => {
  const text = document.getElementById("editor").value;
  const res = await fetch("api.php?action=save", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ content: text, path: "/index.html" })
  });
  const json = await res.json();
  document.getElementById("status").textContent = json.status === "ok"
    ? "✅ Saved!"
    : "❌ Error saving.";
});
