<?php
define('SINDICE_SERVICE', 'http://localhost:8182/sindice/');

$uri = trim(urldecode($_GET['uri']));
$lang = ($_GET['lang']);
if(!$uri || !$lang) {echo 'ERROR 1';exit;}
$uri = explode(',', $uri);
foreach($uri as $i => $temp) $uri[$i] = urlencode($temp);
$uri = implode(',', $uri);
$request = SINDICE_SERVICE."$uri/".urlencode($lang);

$curl = curl_init($request);
curl_setopt($curl, CURLOPT_HEADER, 0);
curl_setopt(
  $curl,
  CURLOPT_HTTPHEADER, 
  array("Content-Type: text/xml; charset=utf-8", "Accept-Charset: utf-8")
);
curl_exec($curl);
curl_close($curl);
?>