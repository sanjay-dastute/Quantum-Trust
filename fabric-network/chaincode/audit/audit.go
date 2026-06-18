package main

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type AuditLog struct {
	LogID     string `json:"log_id"`
	OrgID     string `json:"org_id"`
	UserID    string `json:"user_id"`
	Action    string `json:"action"`
	Timestamp string `json:"timestamp"`
	Payload   string `json:"payload"`
	IsBreach  bool   `json:"is_breach"`
}

func (s *SmartContract) CreateLog(ctx contractapi.TransactionContextInterface, logID string, orgID string, userID string, action string, timestamp string, payload string, isBreach bool) error {
	exists, err := s.LogExists(ctx, logID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the log %s already exists", logID)
	}

	log := AuditLog{
		LogID:     logID,
		OrgID:     orgID,
		UserID:    userID,
		Action:    action,
		Timestamp: timestamp,
		Payload:   payload,
		IsBreach:  isBreach,
	}

	logJSON, err := json.Marshal(log)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(logID, logJSON)
}

func (s *SmartContract) GetLog(ctx contractapi.TransactionContextInterface, logID string) (*AuditLog, error) {
	logJSON, err := ctx.GetStub().GetState(logID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if logJSON == nil {
		return nil, fmt.Errorf("the log %s does not exist", logID)
	}

	var log AuditLog
	err = json.Unmarshal(logJSON, &log)
	if err != nil {
		return nil, err
	}

	return &log, nil
}

func (s *SmartContract) GetLogsByOrg(ctx contractapi.TransactionContextInterface, orgID string) ([]*AuditLog, error) {
	queryString := fmt.Sprintf(`{"selector":{"org_id":"%s"}}`, orgID)
	return s.getQueryResultForQueryString(ctx, queryString)
}

func (s *SmartContract) GetLogsByUser(ctx contractapi.TransactionContextInterface, userID string) ([]*AuditLog, error) {
	queryString := fmt.Sprintf(`{"selector":{"user_id":"%s"}}`, userID)
	return s.getQueryResultForQueryString(ctx, queryString)
}

func (s *SmartContract) LogExists(ctx contractapi.TransactionContextInterface, logID string) (bool, error) {
	logJSON, err := ctx.GetStub().GetState(logID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return logJSON != nil, nil
}

func (s *SmartContract) getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*AuditLog, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var logs []*AuditLog
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var log AuditLog
		err = json.Unmarshal(queryResponse.Value, &log)
		if err != nil {
			return nil, err
		}
		logs = append(logs, &log)
	}

	return logs, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Printf("Error creating quantumtrust audit chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting quantumtrust audit chaincode: %s", err.Error())
	}
}
