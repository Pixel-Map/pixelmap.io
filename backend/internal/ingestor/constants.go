package ingestor

const (
	startBlockNumber    = 2641527
	blockRangeSize      = 10000
	safetyBlockOffset   = 10
	constructorMethodID = "0x60606040"
	imageSize           = 512
	maxPostgresNumeric  = 1e3 // Display max of 1000 eth

	EventTypeImageRender         = "image_render"
	EventTypeDiscordNotification = "discord_notification"
)
