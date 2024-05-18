import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 3,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser
);

router.route("/profile").get(verifyJWT, getCurrentUser);
router.route("/update-profile").patch(verifyJWT, updateAccountDetails);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// change the avatar of the user
router.route("/avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar);
// change the cover image of the user
router.route("/cover-image").post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export default router;