$('#edit-modal').on('show.bs.modal', function(e) {
    console.log(web3.eth.defaultAccount);
    console.log(e.relatedTarget.alt);
    var $modal = $(this),
        esseyId = e.relatedTarget.id;
        $modal.find('.edit-content').html(esseyId);
})
$('#edit-tile').on('show.bs.modal', function(e) {
    console.log(web3.eth.defaultAccount);
    console.log(e.relatedTarget.alt);
    var $modal = $(this),
        esseyId = e.relatedTarget.id;
        $modal.find('.edit-tilecontent').html(esseyId);
})
