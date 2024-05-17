import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Token generation failed")
    }
}

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

    // res.status(200).json({
    //     success: true,
    //     message: "User registered successfully"
    // })

    const { fullname, username, email, password } = req.body;
    // console.log(email, password);

    console.log(req.body);

    if (
        [email, username, password, fullname].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    // console.log(req);
    // console.log(req.files);

    const avatarFilePath = req.files?.avatar[0]?.path;
    let coverImageFilePath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageFilePath = req.files.coverImage[0].path;
    }

    if (!avatarFilePath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarFilePath);
    const coverImage = await uploadOnCloudinary(coverImageFilePath);

    console.log(avatar, coverImage);

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed")
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url ?? "",
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "User creation failed")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    // req.body -> data
    // username or email, password
    // find the user
    // password check
    // generate access and refresh token
    // save the refresh token in the database
    // send cookies

    const { username, password, email } = req.body;
    if (!username || !email || !password) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httponly: true,
        secure: true,
    }

    console.log(accessToken, refreshToken, loggedInUser);

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            },
                "User logged in successfully",
                { secure: true }
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    // remove the refresh token from the database
    // clear the cookies

    // console.log(req);
    console.log('req.user :', req.user);
    console.log(req.user._id);

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        {
            new: true,
        }
    )

    const options = {
        httponly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh Token used or expired!")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        const options = {
            httponly: true,
            secure: true,
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, {
                    accessToken,
                    refreshToken: newRefreshToken,
                }, "Access token refreshed successfully")
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // fetch old password, new password, confirm password
    // find the user 
    // update user password

    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
        throw new ApiError(401, "Password didn't match!");
    }
    // console.log(req.user);
    // console.log(req.body);

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password");
    }

    // update the password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password changed Successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    console.log(req.user);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Fetched current user successfully!"
            )
        )
})

export { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser };

