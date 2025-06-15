<?php
header("Content-Type: application/json");

if ($_GET["action"] === "save") {
  $content = $_POST["content"] ?? "";
  $path    = $_POST["path"]    ?? "/index.html";

  $ftp = ftp_connect(getenv("EZ_FTP_HOST"));
  ftp_login($ftp, getenv("EZ_FTP_USER"), getenv("EZ_FTP_PASS"));

  $tmp = tmpfile();
  fwrite($tmp, $content);
  rewind($tmp);

  ftp_fput($ftp, $path, $tmp, FTP_ASCII);
  fclose($tmp);
  ftp_close($ftp);

  echo json_encode(["status" => "ok"]);
  exit;
}

echo json_encode(["status" => "noop"]);
?>
