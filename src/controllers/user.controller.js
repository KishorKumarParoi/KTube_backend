import { User } from "../models/user.model.js";
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    // step by step guide to register a user
    // 1. get the user data from req.body
    // 2. validate the user data
    // 3. check if the user already exists in the database, check: email, username, phone
    // 4. checking avatar and image files
    // 5. upload the image to the cloudinary
    // 6. create a user object and save the user data in the database
    // 7. remove the password and refresh token from the user object
    // 8. check for user creation
    // 9. return the response

    res.status(200).json({
        success: true,
        message: "User registered successfully"
    })

    const { email, password } = req.body;
    console.log(email, password);

    if (
        [fullname, email, password, username].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{ email }, { username }, { phone }],
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    const avatarFilePath = req.files?.avatar[0]?.path;
    const coverImageFilePath = req.files?.coverImage[0]?.path;

    if (!avatarFilePath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarFilePath);
    const coverImage = await uploadOnCloudinary(coverImageFilePath);

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed")
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "User creation failed")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})

export { registerUser };
