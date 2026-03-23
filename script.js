// To-Do List Logic
$("ul").on("click", "li", function() {
    $(this).toggleClass("completed");
});

$("ul").on("click", "span", function(event) {
    $(this).parent().fadeOut(500, function() {
        $(this).remove();
    });
    event.stopPropagation();
});

$("input[type='text']").keypress(function(event) {
    if (event.which === 13) {
        var todoText = $(this).val();
        $(this).val("");
        $("ul").append("<li><span><i class='fa fa-trash-o'></i></span> " + todoText + "</li>");
    }
});

$(".fa-plus").click(function() {
    $("input[type='text']").fadeToggle();
});

// --- GOOGLE DRIVE UPLOAD LOGIC ---
$("#upload-btn").on("click", function() {
    var fileData = $('#todo-file').prop('files')[0];
    if (!fileData) return alert("Select a file!");

    var formData = new FormData();
    formData.append('file', fileData);

    $("#upload-status").text("Uploading...");

    $.ajax({
        url: 'http://127.0.0.1:5000/upload',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(res) {
            $("#upload-status").text("✅ Success! ID: " + res.file_id);
        },
        error: function(err) {
            $("#upload-status").text("❌ Failed. Check Python console.");
        }
    });
});