'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
	// console.debug('generateStoryMarkup', story);
	const favorites = currentUser.favorites;

	// Check if the story is already in currentUser's favorites
	const favExists = favorites.some((fav) => {
		return fav.storyId === story.storyId;
	});

	const hostName = story.getHostName();

	const $storyList = $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);

	if (currentUser) {
		const $favBtn = $('<button class="favBtn"></button');

		// If story is a favorite, append button with "unfavorite". If it isn't, append with text "favorite"

		if (favExists) {
			$favBtn.text('Unfavorite');
		} else {
			$favBtn.text('Favorite');
		}
		$storyList.append($favBtn);

		const $delBtn = $('<button class="delBtn">&#x2613</button>');
		$storyList.append($delBtn);

		return $storyList;
	} else {
		return $storyList;
	}
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
	console.debug('putStoriesOnPage');

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}

	$allStoriesList.show();
}

/** When the user submits the form, pulls data from the form, calls the .addStory method, and puts the new story on the page
 */

async function submitStory(evt) {
	console.debug('submitStory');
	evt.preventDefault();

	const url = $('#submit-url').val();
	const title = $('#submit-title').val();
	const author = $('#submit-author').val();

	const newStory = { title, author, url };

	const story = await storyList.addStory(currentUser, newStory);

	// console.log(story);

	hidePageComponents();
	putStoriesOnPage();
}

$submitForm.on('submit', submitStory);

async function deleteStory(storyId) {
	console.debug('deleteStory');
	const token = currentUser.loginToken;

	const response = await axios({
		method: 'DELETE',
		url: `${BASE_URL}/stories/${storyId}`,
		data: {
			token
		}
	});

	const deletedStory = response.data.story;
	// console.log(deletedStory.storyId);

	// Repopulate the storyList with the non-deleted stories
	storyList.stories = storyList.stories.filter((story) => {
		return story.storyId !== deletedStory.storyId;
	});
	// console.log(newList);
	// console.log(response);
	putStoriesOnPage();
}

// Event listener on remove buttons. When clicked, deletes story from DOM and API
$allStoriesList.on('click', '.delBtn', async function(evt) {
	const $delStory = $(this).closest('li')[0];
	// console.log($delStory);
	await deleteStory($delStory.id);
});
