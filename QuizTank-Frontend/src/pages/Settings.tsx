import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Gamepad2, Pencil, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { calculateLevelProgress } from "@/utils/levelUtils";

type SettingsTab = "account" | "preferences";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [isEditMode, setIsEditMode] = useState(false);

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [disable2FADialogOpen, setDisable2FADialogOpen] = useState(false);

  // Profile data
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileXp, setProfileXp] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.username) {
        setProfileUsername(user.username);
        setProfileEmail(user.email || "");

        // Optimistically set 2FA status from user object if available
        if ((user as any).is_2fa_enabled !== undefined) {
          setIs2FAEnabled((user as any).is_2fa_enabled);
        }

        try {
          const data = await userService.getProfile(user.username);
          if (data?.user) {
            setProfileName(data.user.full_name || user.username || "");
            setProfileBio(data.user.biography || "");
            if (data.user.email) setProfileEmail(data.user.email);
            if (data.user.profile_pic_url) setProfileAvatar(data.user.profile_pic_url);
            if (data.user.xp !== undefined) setProfileXp(data.user.xp);
            // If backend profile endpoint returns this info
            if (data.user.is_2fa_enabled !== undefined) setIs2FAEnabled(data.user.is_2fa_enabled);

            // Audio preferences
            if (data.user.game_audio !== undefined) setGameAudio(data.user.game_audio === 1);
            if (data.user.game_music !== undefined) setBackgroundMusic([Math.round((data.user.game_music || 0) * 100)]);
            if (data.user.game_sfx !== undefined) setSoundEffect([Math.round((data.user.game_sfx || 0) * 100)]);
          }
        } catch (error) {
          console.error("Failed to load profile", error);
          setProfileName(user.username || "");
        }
      }
    };
    fetchProfile();
  }, [user]);

  // Notification settings
  const [emailNotification, setEmailNotification] = useState(true);
  const [inGameNotification, setInGameNotification] = useState(true);

  // Preferences settings
  const [language, setLanguage] = useState("english");
  const [gameAudio, setGameAudio] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState([30]);
  const [soundEffect, setSoundEffect] = useState([30]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDisable2FA = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/disable-2fa`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIs2FAEnabled(false);
      setDisable2FADialogOpen(false);
      toast.success("Two-factor authentication disabled");
    } catch (error) {
      toast.error("Failed to disable 2FA");
    }
  };

  const handleSaveChanges = async () => {
    // Name validation: Required, Max 30 characters
    if (!profileName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (profileName.length > 30) {
      toast.error("Name must not exceed 30 characters");
      return;
    }
    try {
      await userService.updateProfile({
        full_name: profileName,
        biography: profileBio,
        game_audio: gameAudio ? 1 : 0,
        game_music: backgroundMusic[0] / 100,
        game_sfx: soundEffect[0] / 100
      });
      toast.success("Profile updated successfully!");
      setIsEditMode(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const loadingToast = toast.loading("Uploading avatar...");
      const data = await userService.uploadAvatar(file);
      toast.dismiss(loadingToast);

      if (data.url) {
        setProfileAvatar(data.url);
        toast.success("Avatar updated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload avatar");
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await userService.updateProfile({ profile_pic_url: "" });
      setProfileAvatar("");
      toast.success("Avatar removed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove avatar");
    }
  };

  return (
    <div className="py-4 md:py-8">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Main Content */}
        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Profile Section */}
          <Card>
            <CardContent className="py-4 md:py-6 px-4 md:px-6">
              {isEditMode ? (
                // Edit Mode
                <div className="space-y-4 md:space-y-6">
                  {/* Avatar with Change button */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background">
                      {profileAvatar && (
                        <AvatarImage
                          src={profileAvatar}
                          alt="Profile"
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-muted text-muted-foreground text-xl md:text-2xl">
                        {profileUsername.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left sm:mt-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col gap-2 items-center sm:items-start">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs md:text-sm px-3"
                            onClick={handleAvatarClick}
                          >
                            Upload
                          </Button>
                          {profileAvatar && (
                            <Button
                              size="sm"
                              className="text-xs md:text-sm bg-red-500 hover:bg-red-600 text-white px-3"
                              onClick={handleRemoveAvatar}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">JPG or PNG Max 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Username and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="text-xs md:text-sm font-medium mb-2 block">Username</label>
                      <Input
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        className="bg-muted text-sm md:text-base opacity-70 cursor-not-allowed"
                        readOnly
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-medium mb-2 block">Email</label>
                      <Input
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="bg-muted text-sm md:text-base opacity-70 cursor-not-allowed"
                        type="email"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">Name</label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-muted text-sm md:text-base"
                      maxLength={30}
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">Bio</label>
                    <Textarea
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="bg-muted min-h-[100px] md:min-h-[120px] text-sm md:text-base resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:flex-row-reverse sm:justify-start gap-3 sm:gap-3 pt-2 sm:pt-4">
                    <Button onClick={handleSaveChanges} className="w-full sm:w-auto text-sm">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto text-sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background">
                      {profileAvatar && (
                        <AvatarImage
                          src={profileAvatar}
                          alt="Profile"
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-muted text-muted-foreground text-xl md:text-2xl">
                        {profileUsername.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h3 className="text-lg md:text-xl font-bold mb-0.5 max-w-[250px] sm:max-w-full mx-auto sm:mx-0 truncate">{profileName}</h3>
                      <p className="text-muted-foreground text-xs md:text-sm max-w-[250px] sm:max-w-full mx-auto sm:mx-0 truncate">@{profileUsername}</p>
                      <p className="text-xs md:text-sm mt-1 truncate overflow-hidden max-w-[70vw] sm:max-w-full mx-auto sm:mx-0">{profileBio}</p>
                    </div>
                    <Button variant="outline" className="gap-2 w-full sm:w-fit text-xs md:text-sm" onClick={() => setIsEditMode(true)}>
                      <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                      Edit Profile
                    </Button>
                  </div>

                  {/* Level Progress Bar */}
                  {(() => {
                    const levelInfo = calculateLevelProgress(profileXp);
                    return (
                      <div className="bg-muted/50 rounded-lg p-3 md:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                              Level {levelInfo.level}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel} XP
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${levelInfo.progressPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {levelInfo.xpForNextLevel - levelInfo.currentLevelXp} XP more to reach Level {levelInfo.level + 1}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Section (Password & 2FA) */}
          {activeTab === "account" && (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 md:w-5 md:h-5" />
                  <h3 className="text-base md:text-lg font-semibold">Security</h3>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">
                  Manage your password and security settings
                </p>
                <Separator className="mb-3 md:mb-4" />

                <div className="space-y-4 md:space-y-6">
                  {/* Password */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                      <p className="font-medium text-sm md:text-base">Password</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Set a password that is unique</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs md:text-sm w-fit" onClick={() => navigate('/settings/password')}>
                      Change Password
                    </Button>
                  </div>

                  <Separator />

                  {/* Two-factor Authentication */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                      <p className="font-medium text-sm md:text-base">Two-factor Authentication</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    {is2FAEnabled ? (
                      <Button variant="outline" size="sm" className="text-xs md:text-sm w-fit" onClick={() => setDisable2FADialogOpen(true)}>
                        Disable 2FA
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs md:text-sm w-fit" onClick={() => navigate('/settings/2fa')}>
                        Enable 2FA
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferences Section */}
          {(activeTab === "account" || activeTab === "preferences") && (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" />
                  <h3 className="text-base md:text-lg font-semibold">Gameplay</h3>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">
                  Customize your gameplay experience
                </p>
                <Separator className="mb-3 md:mb-4" />

                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">Game Audio</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Enable game audio</p>
                    </div>
                    <Switch
                      checked={gameAudio}
                      onCheckedChange={setGameAudio}
                    />
                  </div>

                  <div className={!gameAudio ? "opacity-40 pointer-events-none" : ""}>
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                      <p className="font-medium text-sm md:text-base">Background Music</p>
                      <span className="text-sm font-bold text-muted-foreground">{backgroundMusic[0]}%</span>
                    </div>
                    <Slider
                      value={backgroundMusic}
                      onValueChange={setBackgroundMusic}
                      max={100}
                      step={10}
                      disabled={!gameAudio}
                    />
                  </div>

                  <div className={!gameAudio ? "opacity-40 pointer-events-none" : ""}>
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                      <p className="font-medium text-sm md:text-base">Sound Effect</p>
                      <span className="text-sm font-bold text-muted-foreground">{soundEffect[0]}%</span>
                    </div>
                    <Slider
                      value={soundEffect}
                      onValueChange={setSoundEffect}
                      max={100}
                      step={10}
                      disabled={!gameAudio}
                    />
                  </div>

                  {(activeTab === "account" || activeTab === "preferences") && !isEditMode && (
                    <div className="flex justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={handleSaveChanges}
                        className="text-xs md:text-sm"
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>

      <AlertDialog open={disable2FADialogOpen} onOpenChange={setDisable2FADialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable 2FA? This will make your account less secure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable2FA} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
