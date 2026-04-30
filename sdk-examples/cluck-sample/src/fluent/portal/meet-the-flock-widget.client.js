function MeetTheFlockCtrl() {
    var c = this
    c.searchQuery = ''
    c.selectedBreed = 'All Breeds'
    c.saved = {}
    c.newsletterEmail = ''

    c.toggleSave = function (sysId) {
        c.saved[sysId] = !c.saved[sysId]
    }
}
