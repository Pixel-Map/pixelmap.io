import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { MachineImage, NatInstanceProviderV2 } from "aws-cdk-lib/aws-ec2";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { LookupMachineImage } from "aws-cdk-lib/aws-ec2";
import { InstanceType, InstanceClass, InstanceSize } from "aws-cdk-lib/aws-ec2";
import { Peer, Port } from "aws-cdk-lib/aws-ec2";
import { Duration } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseInstance, DatabaseInstanceEngine } from "aws-cdk-lib/aws-rds";
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { KeyPair } from "aws-cdk-lib/aws-ec2";
import { Instance } from "aws-cdk-lib/aws-ec2";
import { StorageType } from "aws-cdk-lib/aws-rds";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { FckNatInstanceProvider } from "cdk-fck-nat";

export class PixelMap extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Replace the my_ip constant with a CfnParameter
		const myIpParameter = new cdk.CfnParameter(this, "ipaddress", {
			type: "String",
			description: "Your current IP address",
		});

		const vpc = new Vpc(this, "pixelmap-vpc", {
			availabilityZones: ["us-east-1a", "us-east-1b"],
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: "public",
					subnetType: SubnetType.PUBLIC,
				},
			],
			vpcName: "pixelmap-vpc",
		});

		// db3.t3.micro RDS postgres database
		const db = new DatabaseInstance(this, "pixelmap-db", {
			databaseName: "pixelmap",
			instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
			engine: DatabaseInstanceEngine.postgres({
				version: PostgresEngineVersion.VER_16_4,
			}),
			vpc,
			vpcSubnets: {
				subnetType: SubnetType.PUBLIC,
			},
			iamAuthentication: true,
			publiclyAccessible: true,
			multiAz: false,
			storageEncrypted: false,
			enablePerformanceInsights: false,
			deletionProtection: false,
			storageType: StorageType.GP3,
			allocatedStorage: 20,
			maxAllocatedStorage: 20,
		});

		// IAM Role for instance to write to DB
		const instanceRole = new Role(this, "pixelmap-instance-role", {
			assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
		});
		db.connections.allowFrom(Peer.ipv4(vpc.vpcCidrBlock), Port.allTraffic());
		db.connections.allowFrom(
			Peer.ipv4(myIpParameter.valueAsString),
			Port.allTraffic(),
		);

		db.grantConnect(instanceRole);
		instanceRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName("AmazonRDSFullAccess"),
		);

		// Import key pair name neo-pixelmap
		const keyPair = KeyPair.fromKeyPairName(
			this,
			"neo-pixelmap",
			"neo-pixelmap",
		);
		// Add a security group to the instance
		const securityGroup = new SecurityGroup(
			this,
			"pixelmap-instance-security-group",
			{
				vpc,
				allowAllOutbound: true,
			},
		);
		securityGroup.addIngressRule(
			Peer.ipv4(vpc.vpcCidrBlock),
			Port.allTraffic(),
		);
		securityGroup.addIngressRule(
			Peer.ipv4(myIpParameter.valueAsString),
			Port.allTraffic(),
		);
		// EC2 instance to run the backend
		const instance = new Instance(this, "pixelmap-instance", {
			instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.NANO),
			instanceName: "pixelmap-backend",
			vpcSubnets: {
				subnetType: SubnetType.PUBLIC,
			},
			vpc,
			machineImage: MachineImage.latestAmazonLinux2023(),
			keyPair: keyPair,
			associatePublicIpAddress: true,
			securityGroup: securityGroup,
		});
	}
}
