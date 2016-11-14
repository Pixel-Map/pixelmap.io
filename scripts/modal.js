$('#edit-modal').on('show.bs.modal', function(e) {
    var $modal = $(this),
        esseyId = e.relatedTarget.id;
        $modal.find('.edit-content').html(esseyId);
})
