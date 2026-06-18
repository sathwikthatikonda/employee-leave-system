exports.handler = async (event) => {
    const expectedAnswer = event.request.privateChallengeParameters.answer;
    
    // Check if the answer matches the one we saved
    if (event.request.challengeAnswer === expectedAnswer) {
        event.response.answerCorrect = true;
    } else {
        event.response.answerCorrect = false;
    }

    return event;
};
