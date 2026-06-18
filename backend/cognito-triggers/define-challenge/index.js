exports.handler = async (event) => {
    // If the user doesn't exist or is blocked
    if (event.request.userNotFound) {
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
        return event;
    }

    if (event.request.session && event.request.session.length >= 3 && event.request.session.slice(-1)[0].challengeResult === false) {
        // The user provided a wrong answer 3 times; fail auth
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
        return event;
    } else if (event.request.session && event.request.session.length > 0 && event.request.session.slice(-1)[0].challengeResult === true) {
        // The user provided the right answer; succeed auth
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
        return event;
    } else {
        // The user did not provide a correct answer yet; present challenge
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = 'CUSTOM_CHALLENGE';
        return event;
    }
};
