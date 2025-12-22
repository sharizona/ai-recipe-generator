// src/utils/testUtils.ts
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export async function updateCreditsForTesting(credits: number = 10) {
    try {
        const user = await getCurrentUser();

        const userCreditsList = await client.models.UserCredits.list({
            filter: { userId: { eq: user.userId } }
        });

        if (userCreditsList.data.length > 0) {
            const result = await client.models.UserCredits.update({
                id: userCreditsList.data[0].id,
                credits: credits
            });
            console.log(`Credits updated to ${credits}!`, result);

            // Trigger a custom event that the App component can listen to
            window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits } }));

            return result;
        } else {
            console.error('No credit records found.');
            return null;
        }
    } catch (error) {
        console.error('Error updating credits:', error);
        throw error;
    }
}

export async function getCurrentUserCredits() {
    try {
        const user = await getCurrentUser();

        const userCreditsList = await client.models.UserCredits.list({
            filter: { userId: { eq: user.userId } }
        });

        if (userCreditsList.data.length > 0) {
            console.log('Current credits:', userCreditsList.data[0].credits);
            console.log('User ID:', userCreditsList.data[0].userId);
            console.log('Email:', userCreditsList.data[0].email);
            return userCreditsList.data[0];
        } else {
            console.log('No credit records found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching credits:', error);
        throw error;
    }
}

export async function createUserCredits(initialCredits: number = 5) {
    try {
        const user = await getCurrentUser();

        const result = await client.models.UserCredits.create({
            userId: user.userId,
            credits: initialCredits,
            email: user.signInDetails?.loginId || ''
        });

        console.log('UserCredits record created!', result);

        // Trigger UI update
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: initialCredits } }));

        return result;
    } catch (error) {
        console.error('Error creating credits:', error);
        throw error;
    }
}