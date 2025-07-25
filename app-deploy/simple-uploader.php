<?php
// Simple file uploader for deployment
if ($_POST && isset($_FILES['file'])) {
    $target = '/var/www/html/' . basename($_FILES['file']['name']);
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        chmod($target, 0644);
        echo "✅ Uploaded successfully: " . basename($_FILES['file']['name']);
        echo "<br><a href='/" . basename($_FILES['file']['name']) . "'>View File</a>";
    } else {
        echo "❌ Upload failed";
    }
}
?>
<html>
<head><title>File Uploader</title></head>
<body>
<h2>📤 File Uploader</h2>
<form method="post" enctype="multipart/form-data">
    <input type="file" name="file" accept=".php">
    <button type="submit">Upload</button>
</form>
</body>
</html>