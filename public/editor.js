document.getElementById("saveBtn").addEventListener("click", async () => {
  const text = document.getElementById("editor").value;
  const resp = await fetch("api.php?action=save", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ path:"/index.html", content:text })
  });
  const json = await resp.json();
  const status = document.getElementById("status");
  status.className = "";
  if (json.status === "ok") {
    status.textContent = "✅ Saved!";
    status.classList.add("ok");
  } else {
    status.textContent = "❌ Error";
    status.classList.add("err");
  }
});
