$(document).ready(function() {
    $('.edit').editable('/translate/ajax_edit', {
        cssclass : 'translation_edit',
        indicator : 'Saving...',
        tooltip   : 'Click to edit...',
        callback : function(value, settings) {
            $(this).removeClass('empty_edit');
        }
    });     
    
    $('.click-to-open').click(function() {
        var id = $(this).attr('id');
        id = id.replace('to-', '');
        if ($('#from-'+id).hasClass('close')) {
            $('#from-'+id).show();
            $('#from-'+id).removeClass('close');
            $(this).html("Click to close");
        } else {
            $('#from-'+id).hide();
            $('#from-'+id).addClass('close');
            $(this).html("Click to open");
        }
    });
});