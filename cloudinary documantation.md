Node.js quick start

Last updated: Apr-15-2026

This quick start lets you get an end-to-end implementation up and running using the Node.js SDK in 5 minutes or less.

On this page:
Prerequisites

1. Set up and configure the SDK
2. Upload an image
3. Get and use details of the image
4. Transform the image
5. Run your code
View the completed code
Next steps
Rate this page:

one star two stars three stars four stars five stars
Prerequisites
Tip To start with full example apps, see Node.js sample projects.

1. Set up and configure the SDK
Install the SDK
In a terminal in your Node.js environment, run:

npm install cloudinary
Set your API environment variable
In a terminal, set your CLOUDINARY_URL environment variable.

Copy the API environment variable format from the API Keys page of the Cloudinary Console Settings. Replace <your_api_key> and <your_api_secret> with your actual values. Your cloud name is already correctly included in the format.

On Mac or Linux:

export CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
On Windows:

set CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
Important
When writing your own applications, follow your organization's policy on storing secrets and don't expose your API secret.
If you use a method that involves writing your environment variable to a file (e.g. dotenv), the file should be excluded from your version control system, so as not to expose it publicly.
Configure Cloudinary
Create a new file called index.js and copy and paste the following into this file:

index.js
Node.js

// Require the cloudinary library
const cloudinary = require('cloudinary').v2;

// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true
});

// Log the configuration
console.log(cloudinary.config());
More info about configuration...
2. Upload an image
Copy and paste this into index.js:

index.js (continued)
Node.js

/////////////////////////
// Uploads an image file
/////////////////////////
const uploadImage = async (imagePath) => {

    // Use the uploaded file's name as the asset's public ID and 
    // allow overwriting the asset with new versions
    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };

    try {
      // Upload the image
      const result = await cloudinary.uploader.upload(imagePath, options);
      console.log(result);
      return result.public_id;
    } catch (error) {
      console.error(error);
    }
};
More info about upload...
3. Get and use details of the image
Copy and paste this into index.js:

index.js (continued)
Node.js

/////////////////////////////////////
// Gets details of an uploaded image
/////////////////////////////////////
const getAssetInfo = async (publicId) => {

    // Return colors in the response
    const options = {
      colors: true,
    };

    try {
        // Get details about the asset
        const result = await cloudinary.api.resource(publicId, options);
        console.log(result);
        return result.colors;
        } catch (error) {
        console.error(error);
    }
};
More info about getting details of an asset...
4. Transform the image
Copy and paste this into index.js:

index.js (continued)
Node.js

//////////////////////////////////////////////////////////////
// Creates an HTML image tag with a transformation that
// results in a circular thumbnail crop of the image  
// focused on the faces, applying an outline of the  
// first color, and setting a background of the second color.
//////////////////////////////////////////////////////////////
const createImageTag = (publicId, ...colors) => {

    // Set the effect color and background color
    const [effectColor, backgroundColor] = colors;

    // Create an image tag with transformations applied to the src URL
    let imageTag = cloudinary.image(publicId, {
      transformation: [
        { width: 250, height: 250, gravity: 'faces', crop: 'thumb' },
        { radius: 'max' },
        { effect: 'outline:10', color: effectColor },
        { background: backgroundColor },
      ],
    });

    return imageTag;
};
More info about transformations...
5. Run your code
Copy and paste this into index.js to call the functions you just created:

index.js (continued)
Node.js

//////////////////
//
// Main function
//
//////////////////
(async () => {

    // Set the image to upload
    const imagePath = 'https://cloudinary-devs.github.io/cld-docs-assets/assets/images/happy_people.jpg';

    // Upload the image
    const publicId = await uploadImage(imagePath);

    // Get the colors in the image
    const colors = await getAssetInfo(publicId);

    // Create an image tag, using two of the colors in a transformation
    const imageTag = await createImageTag(publicId, colors[0][0], colors[1][0]);

    // Log the image tag to the console
    console.log(imageTag);

})();
Save your changes then run the script from the terminal:

node index.js
Check the configuration...
Check the upload response...
You can see the image that has been uploaded to your Cloudinary storage by copying the secure_url that is returned in the upload response and pasting it in a browser.

URL

<https://res.cloudinary.com/demo/image/upload/v1651585298/happy_people.jpg>
Happy people image
Check the resource response...
Check the image tag...
You can use the returned image tag to display the image on your website. For now, copy and paste the URL to see the transformed image in the browser:

URL
