function getCurrentShortenedUrl(f) {
    var longUrl = window.location.href;
    $.ajax({
        type: 'POST',
        url: 'index.php', 
        data: {longurl: longUrl}, 
        success: function(data) {
            f.call(this, data);
        } // success()
    });
} // getCurrentShortenedUrl()