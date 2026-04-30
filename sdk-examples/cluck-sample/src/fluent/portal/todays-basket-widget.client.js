function TodaysBasketCtrl() {
    var c = this
    c.newsletterEmail = ''

    var grades = c.data && c.data.grades ? c.data.grades : {}
    var total = c.data && c.data.total ? c.data.total : 0

    c.gradesList = [
        { key: 'jumbo', label: 'Jumbo', count: grades.jumbo || 0, novelty: false },
        { key: 'xlarge', label: 'Extra Large', count: grades.xlarge || 0, novelty: false },
        { key: 'large', label: 'Large', count: grades.large || 0, novelty: false },
        { key: 'medium', label: 'Medium', count: grades.medium || 0, novelty: false },
        { key: 'small', label: 'Small', count: grades.small || 0, novelty: false },
        { key: 'doubleYolk', label: 'Double Yolk', count: grades.doubleYolk || 0, novelty: true },
    ]

    c.percent = function (count) {
        if (!total || total <= 0) return 0
        return Math.min(100, Math.round((count / total) * 100))
    }
}
