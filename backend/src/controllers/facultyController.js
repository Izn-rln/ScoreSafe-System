exports.removeFaculty = async (req, res) => {
    const { email } = req.body; // or req.params.email

    try {
        // 1. Remove from the whitelist so they can't re-login as a teacher
        await db.query('DELETE FROM teacher_whitelist WHERE email = ?', [email]);

        // 2. IMPORTANT: Demote them in the users table immediately
        // This stops the "Already registered as Teacher" bug for the next time
        await db.query(
            "UPDATE users SET role = 'student', is_approved = 0 WHERE username = ?", 
            [email]
        );

        res.json({ message: "Faculty removed and demoted to student successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fully remove faculty." });
    }
};